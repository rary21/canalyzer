import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">CANalyzer</h1>
        <p className="text-xl text-gray-600">CAN信号解析ツール</p>
      </div>
      
      <FileUpload />
    </main>
  );
}
