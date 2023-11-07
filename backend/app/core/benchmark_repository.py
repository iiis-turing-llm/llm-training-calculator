import csv


class BenchmarkRepository:

    def read_benchmark_file(self, content):
        data = []
        current_object = []
        is_valid_object = False  # 用于标记是否当前对象是完整的
        reader = csv.reader(content)
        for row in reader:
            if row[0] == "iteration start":
                if current_object:  # 如果上一个对象不完整，则舍弃
                    if is_valid_object:
                        data.append(current_object)
                current_object = [(row[0], row[1])]  # 创建新对象
                is_valid_object = False  # 重置对象有效标记
            elif row[0] == "iteration end":
                current_object.append((row[0], row[1]))  # 加入"iteration end"
                is_valid_object = True  # 标记对象为完整
            else:
                current_object.append((row[0], row[1]))  # 加入其他行的数据
        if current_object and is_valid_object:  # 处理最后一个对象
            data.append(current_object)

        print(data)
        return data
