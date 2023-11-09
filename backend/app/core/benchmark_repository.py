import csv


class BenchmarkRepository:

    def read_benchmark_file(self, content):
        data = []
        current_object = []
        has_start = False
        reader = csv.reader(content)
        for row in reader:
            if row[0] == 'iteration start':
                current_object = [(row[0], row[1])]
                has_start = True
            elif row[0] == 'iteration end':
                current_object.append((row[0], row[1]))
                if has_start:
                    data.append(current_object)
                    current_object = []
                    has_start = False
            else:
                current_object.append((row[0], row[1]))

        print(data)
        return data
